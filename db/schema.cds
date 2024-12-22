using { Currency, managed, sap, cuid } from '@sap/cds/common';
namespace sap.capire.bookshop;

entity Books : cuid, managed {
  title    : localized String(111);
  descr    : localized String(1111);
  author   : Association to Authors;
  genre    : Association to Genres;
  stock    : Integer;
  price    : Decimal(9,2);
  currency : Currency;
}

entity Orders : cuid, managed {
  book      : Association to Books;
  user      : Association to Users;
  quantity  : Integer;
  totalPrice: Decimal(9,2);
  status    : String(50); // e.g., "Created", "Cancelled"
}

entity Users : managed {
  key ID   : String;
  name     : String;
  email    : String;
  orders   : Association to many Orders on orders.user = $self;
}

entity Wishlists :cuid,  managed {
    user      : Association to Users ; 
    items     : Association to many WishlistItems on items.wishlist = $self;
}

entity WishlistItems : cuid ,managed {
    wishlist  : Association to Wishlists; // A wishlist item belongs to a wishlist
    book      : Association to Books;     // A wishlist item is associated with a book
}

entity Authors : cuid, managed {
  name   : String(111);
  books  : Association to many Books on books.author = $self;
}

/** Hierarchically organized Code List for Genres */
entity Genres : sap.common.CodeList {
  key ID      : Integer;
  parent      : Association to Genres;
  children    : Composition of many Genres on children.parent = $self;
}
