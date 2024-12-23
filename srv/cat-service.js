import cds from "@sap/cds"
const { ApplicationService } = cds;
class CatalogService extends ApplicationService {
  async init() {

    const db = await cds.connect.to("db"); // Connect to the database service
    const { Books, Orders, Users, WishlistItems} = db.model.entities; // Access entities from the CDS model

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

    this.on('submitOrder', async (req) => {
      const { book, quantity, user } = req.data;

      try {
        // Check and update stock atomically
        const updateStock = await cds.run(`
          UPDATE SAP_CAPIRE_BOOKSHOP_BOOKS
          SET stock = stock - ?
          WHERE ID = ? AND stock >= ?
        `, [quantity, book, quantity]);

        if (updateStock.changes === 0) {
          return req.error(409, `Requested quantity (${quantity}) exceeds available stock`);
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
        await cds.run(`
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

    this.on('addToWishlist', async (req) => {
      const { book: bookId, user: userId } = req.data;

      // Check if the book exists
      const book = await SELECT.one.from(Books).where({ ID: bookId });
      if (!book) {
        req.error(404, `Book with ID ${bookId} not found.`);
      }

      // Check if the user exists
      const user = await SELECT.one.from(Users).where({ ID: userId });
      if (!user) {
        req.error(404, `User with ID ${userId} not found.`);
      }

      // Check if the book is already in the user's wishlist
      const existingEntry = await SELECT.one.from(WishlistItems).where({ book_ID: bookId, user_ID: userId });
      if (existingEntry) {
        req.error(400, `Book is already in the user's wishlist.`);
      }

      // Add the book to the wishlist
      const result = await INSERT.into(WishlistItems).entries({
        book_ID: bookId,
        user_ID: userId
      });

      return result;
    });

    /**
     * Remove a book from the user's wishlist.
     */
    this.on('DELETE','RemoveFromWishlist', async (req) => {
      const { wishlistItem: wishlistItemId } = req.data;

      // Check if the wishlist item exists
      const wishlistItem = await SELECT.one.from(WishlistItems).where({ ID: wishlistItemId });
      if (!wishlistItem) {
        req.error(404, `Wishlist item with ID ${wishlistItemId} not found.`);
      }

      // Delete the wishlist item
      const result = await DELETE.from(WishlistItems).where({ ID: wishlistItemId });

      return result;
    });

    return super.init();
  }
}
export default CatalogService;
