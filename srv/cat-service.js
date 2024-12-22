import cds from "@sap/cds"
const { ApplicationService , entities, run} = cds;
class CatalogService extends ApplicationService {
  async init() {

    const db = await cds.connect.to("db"); // Connect to the database service
    const { Books, Orders } = db.model.entities; // Access entities from the CDS model
    

    this.on('submitOrder', async (req) => {
      const { book, quantity, user } = req.data;

      try {
        // Check and update stock atomically
        const updateStock = await run(`
          UPDATE SAP_CAPIRE_BOOKSHOP_BOOKS
          SET stock = stock - ?
          WHERE ID = ? AND stock >= ?
        `, [quantity, book, quantity]);

        if (updateStock === 0) {
          return req.reject(409, `Requested quantity (${quantity}) exceeds available stock or book #${book} does not exist.`);
        }

        // Retrieve book details for calculating total price
        const bookDetails = await SELECT.one.from(Books).where({ ID: book });
        if (!bookDetails) {
          return req.reject(404, `Book with ID #${book} not found.`);
        }

        const totalPrice = bookDetails.price * quantity;

        // Create order entry
        await INSERT.into(Orders).entries({
          book_ID: book,
          user_ID: user,
          quantity,
          totalPrice,
          status: 'Created'
        });

        req.info(`Order placed successfully for ${quantity} units of book #${book}. Total price: ${totalPrice}`);

      } catch (err) {
        console.error("Error processing order:", err);
        return req.reject(500, "An unexpected error occurred while processing your order.");
      }
    });

    this.on('cancelOrder', async (req) => {
      const { order } = req.data;

      try {
        // Retrieve order details
        const orderDetails = await SELECT.one.from(Orders).where({ ID: order });
        if (!orderDetails) {
          return req.reject(404, `Order with ID #${order} not found.`);
        }

        if (orderDetails.status === 'Cancelled') {
          return req.reject(400, `Order #${order} is already cancelled.`);
        }

        // Update stock and mark order as cancelled
        await run(`
          UPDATE sap_capire_bookshop_Books
          SET stock = stock + ?
          WHERE ID = ?
        `, [orderDetails.quantity, orderDetails.book_ID]);

        await UPDATE(Orders).set({ status: 'Cancelled' }).where({ ID: order });

        req.info(`Order #${order} has been successfully cancelled.`);

      } catch (err) {
        console.error("Error cancelling order:", err);
        return req.reject(500, "An unexpected error occurred while cancelling your order.");
      }
    });

    return super.init();
  }
}
export default CatalogService;
