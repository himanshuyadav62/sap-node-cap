using { sap.capire.bookshop as my } from '../db/schema';
service CatalogService @(path:'/browse') {

  @readonly entity Books as select from my.Books {*,
    author.name as author
  } excluding { createdBy, modifiedBy };

  @readonly entity Orders as select from my.Orders {
    *,
    book.title as bookTitle,
    user.name as userName
  } excluding { createdBy, modifiedBy };

  @readonly entity Users as select from my.Users {
    *
  } excluding { createdBy, modifiedBy };

  @requires: 'authenticated-user'
  action submitOrder (book: Books:ID, quantity: Integer, user: Users:ID);

  @requires: 'authenticated-user'
  action cancelOrder (order: Orders:ID);

  @requires: 'authenticated-user'
  action addToWishlist (book: Books:ID, user: Users:ID);

  @requires: 'authenticated-user'
  action removeFromWishlist (wishlistItem: my.WishlistItems:ID);

  @readonly @requires: 'authenticated-user'
  entity Wishlist as select from my.WishlistItems {
    *,
    book.title as bookTitle,
    user.name as userName
  } excluding { createdBy, modifiedBy };
}
