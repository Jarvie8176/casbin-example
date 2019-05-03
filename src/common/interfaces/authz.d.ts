export interface UserContext {
  id: number;
  privilegeLevel?: number,
  persona: UserPersona[];
}

export interface UserPersona {
  type: "doctor" | "patient" | "accountant" | "admin";
  id: number;
}
