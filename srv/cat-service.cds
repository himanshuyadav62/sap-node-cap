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


 entity Wishlists as projection on my.Wishlists;
    action addBookToWishlist(userID: UUID, bookID: UUID);
    action deleteBookFromWishlist(userID: UUID, bookID: UUID);
}
