import pkg from '@sap/cds';
const { ApplicationService } = pkg;

class AdminService extends ApplicationService {
    init() {
        // Validation for Books updates
        this.before('UPDATE', 'Books', async (req) => {
            const { data } = req;

            console.log("Before updating book entity " + req.data); 
            
            // Get the existing book record
            const book = await SELECT.one.from(req.target).where({ ID: req.data.ID });
            if (!book) throw new Error(`Book with ID ${req.data.ID} not found`);

            // Validate price
            if (data.price !== undefined) {
                if (data.price < 0) {
                    req.error(400, 'Book price cannot be negative');
                }
                // Optional: Check for reasonable price range
                if (data.price > 10000) {
                    req.error(400, 'Book price exceeds maximum allowed value');
                }
            }

            // Validate stock
            if (data.stock !== undefined) {
                if (data.stock < 0) {
                    req.error(400, 'Book stock cannot be negative');
                }
                // Optional: Check for reasonable stock range
                if (data.stock > 10000) {
                    req.error(400, 'Stock value exceeds maximum allowed quantity');
                }
            }

            // Validate title length
            if (data.title) {
                if (data.title.length > 111) {
                    req.error(400, 'Title exceeds maximum length of 111 characters');
                }
                if (data.title.trim().length === 0) {
                    req.error(400, 'Title cannot be empty');
                }
            }

            // Validate description length
            if (data.descr && data.descr.length > 1111) {
                req.error(400, 'Description exceeds maximum length of 1111 characters');
            }

            // Check if referenced author exists
            if (data.author_ID) {
                const author = await SELECT.one.from('Authors').where({ ID: data.author_ID });
                if (!author) {
                    req.error(400, `Referenced author with ID ${data.author_ID} does not exist`);
                }
            }
        });

        // Validation for Authors updates
        this.before('UPDATE', 'Authors', async (req) => {
            const { data } = req;

            // Get the existing author record
            const author = await SELECT.one.from(req.target).where({ ID: req.data.ID });
            if (!author) throw new Error(`Author with ID ${req.data.ID} not found`);

            // Validate author name
            if (data.name) {
                if (data.name.length > 111) {
                    req.error(400, 'Author name exceeds maximum length of 111 characters');
                }
                if (data.name.trim().length === 0) {
                    req.error(400, 'Author name cannot be empty');
                }

                // Check for duplicate author names
                const existingAuthor = await SELECT.one.from('Authors')
                    .where({ name: data.name, ID: { '!=': req.data.ID } });
                    
                if (existingAuthor) {
                    req.error(400, `Author with name "${data.name}" already exists`);
                }
            }
        });

        // Call super.init() to ensure proper initialization
        return super.init();
    }
}

export default AdminService;