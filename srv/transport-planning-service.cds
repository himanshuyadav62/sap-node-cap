using { PACCAR_DB as db } from '../db/paccar';

service TransportPlanningService {
  entity TransportPlanning as projection on db.T_TransportPlanning;
}