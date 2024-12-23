import cds from "@sap/cds";

export default class TransportPlanningService extends cds.ApplicationService {
  async init() {

    function getQueryField(input) {
      switch (input.toLowerCase()) {
        case "baan":
          return "BAAN";
        case "sapecc":
          return "SAP_ECC";
        case "ops":
          return "OPS";
        case "saps4":
          return "SAP_S4";
        case "jde":
          return "JDE";
        case "as400":
          return "AS_400";
        default:
          return null;
      }
    }

    this.on("transportPlan", async (req,res) => {
      const { tpDtoList } = req.data;
      const result = []; 

      // Validate input
      if (!Array.isArray(tpDtoList) || tpDtoList.length === 0) {
        return { access: [] };
      }

      
      const matchResult = await getPrimaryId(tpDtoList);

      for (const item of tpDtoList) {
        const obj = { number: item.number };

        if (item.identifier === "Y") {
          obj.primaryId = item.number;
        } else {
          const matchedData = matchResult.find(
            (match) => match[getQueryField(item.source)] === item.number
          );
          obj.primaryId = matchedData ? matchedData.primaryId : "";
        }

        result.push(obj);
      }

      let response =  { access: result };
      console.log(response); 
      return response; 
    });

    async function getPrimaryId(data) {
      if (!data || data.length === 0) return [];

      const source = data[0].source;
      const queryField = getQueryField(source);

      if (!queryField) return [];

      const numbersToLookup = data
        .filter((item) => item.identifier === "N")
        .map((item) => item.number);

      if (numbersToLookup.length === 0) return [];

      try {
        const query = cds.parse.cql(
          `SELECT ${queryField}, min(PRIMARY_ID) as primaryId 
           FROM PACCAR_DB.T_TransportPlanning 
           WHERE ${queryField} in (${numbersToLookup.map(num => `'${num}'`).join(',')})
           AND PRIMARY_ID is not null 
           GROUP BY ${queryField}`
        );

        let data =  await cds.run(query);
        return data; 
      } catch (error) {
        console.error('Query execution error:', error);
        return [];
      }
    }

    await super.init();
  }
}