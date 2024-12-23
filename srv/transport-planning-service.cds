using {PACCAR_DB as db} from '../db/paccar';

service TransportPlanningService {

  action transportPlan(tpDtoList : array of {
    source : String;
    identifier : String;
    number : String;
  }) returns array of {};

}
