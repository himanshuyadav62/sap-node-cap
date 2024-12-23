const cds = require('@sap/cds');

module.exports = class TransportPlanningService extends cds.ApplicationService {
    async init() {
        const { TransportPlanning } = this.entities;
        
        this.on('getPrimaryId', async (req) => {
            try {
                const { tpDtoList } = req.data;
                if (!Array.isArray(tpDtoList) || !tpDtoList.length) {
                    return { access: [] };
                }

                const source = tpDtoList[0].source.toLowerCase();
                const result = [];
                
                // Build query based on source system
                let queryField;
                switch (source) {
                    case 'baan':
                        queryField = 'BAAN';
                        break;
                    case 'sapecc':
                        queryField = 'SAP_ECC';
                        break;
                    case 'ops':
                        queryField = 'OPS';
                        break;
                    case 'saps4':
                        queryField = 'SAP_S4';
                        break;
                    case 'jde':
                        queryField = 'JDE';
                        break;
                    case 'as400':
                        queryField = 'AS_400';
                        break;
                    default:
                        return { access: [] };
                }

                // Get numbers that need to be looked up
                const numbersToLookup = tpDtoList
                    .filter(item => item.identifier === 'N')
                    .map(item => item.number);

                // If we have numbers to look up, query the database
                let matchResult = [];
                if (numbersToLookup.length > 0) {
                    // Build CQL query
                    const query = SELECT
                        .min('PRIMARY_ID').as('primaryId')
                        .from(TransportPlanning)
                        .where(`${queryField} in`, numbersToLookup)
                        .and('PRIMARY_ID is not null')
                        .groupBy(queryField);

                    const records = await cds.run(query);
                    
                    // Transform records into required format
                    matchResult = records.map(record => ({
                        primaryId: record.primaryId,
                        number: record[queryField]
                    }));
                }

                // Process each item in the input array
                for (const item of tpDtoList) {
                    const obj = { number: item.number };
                    
                    if (item.identifier === 'Y') {
                        obj.primaryId = item.number;
                    } else {
                        const matchedData = matchResult.find(match => match.number === item.number);
                        obj.primaryId = matchedData ? matchedData.primaryId : '';
                    }
                    
                    result.push(obj);
                }

                return { access: result };
            } catch (error) {
                req.error(500, error.message);
            }
        });

        await super.init();
    }
};