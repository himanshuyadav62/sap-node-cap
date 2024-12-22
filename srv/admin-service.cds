using { sap.capire.bookshop as my } from '../db/schema';

service AdminService @(requires:'authenticated-user') { 
  entity Books as projection on my.Books;
  entity Authors as projection on my.Authors;
  entity Users as projection on my.Users; 
  entity Order as projection on my.Orders; 
}