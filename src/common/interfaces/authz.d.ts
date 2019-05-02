export interface UserContext {
  id: number;
  persona: UserPersona[];
}

export interface UserPersona {
  type: "doctor" | "patient" | "accountant" | "admin";
  id: number;
}
