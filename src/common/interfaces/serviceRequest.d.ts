export interface PatientsServiceRequest {
  subject: {};
  target: {
    patientId: number;
    action: string;
    attributes: string[];
  };
}
