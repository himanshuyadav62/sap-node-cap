namespace PACCAR_DB;

entity T_TransportPlanning {
  key ID: Integer;
  AS_400: String;
  BAAN: String;
  BP_NO: String;
  JDE: String;
  OPS: String;
  PRIMARY_ID: String;
  SAP_ECC: String;
  SAP_S4: String;
  TYPE: Integer;
  SUPPLIER_ADDRESS: String;
  SUPPLIER_COUNTRY: String;
  SUPPLIER_NAME: String;
  WINCH: String;
  KENFAB: String(20);
  UPDATED_DATE: Timestamp;
  MSA: String;
  UPLOADED_BY: String;
  UPLOADED_DATE: Timestamp;
}