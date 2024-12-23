namespace sap.capire.bookshop;

using
{
    Currency,
    managed,
    sap,
    cuid
}
from '@sap/cds/common';

entity Books : cuid, managed
{
    title : localized String(111);
    descr : localized String(1111);
    author : Association to one Authors;
    genre : Association to one Genres;
    stock : Integer;
    price : Decimal(9,2);
    currency : Currency;
}

entity Orders : cuid, managed
{
    book : Association to one Books;
    user : Association to one Users;
    quantity : Integer;
    totalPrice : Decimal(9,2);
    status : String(50);
}

entity Users : managed
{
    key ID : String;
    name : String;
    email : String;
    orders : Association to many Orders on orders.user = $self;
}

entity Authors : cuid, managed
{
    name : String(111);
    books : Association to many Books on books.author = $self;
}

/**
 * Hierarchically organized Code List for Genres
 */
entity Genres : sap.common.CodeList
{
    key ID : Integer;
    parent : Association to one Genres;
    children : Composition of many Genres on children.parent = $self;
}

entity WishlistItems : cuid, managed
{
    book : Association to one Books;
    user : Association to one Users;
}
