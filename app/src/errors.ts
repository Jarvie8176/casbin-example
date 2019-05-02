export class AuthzError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, AuthzError.prototype);
    }
}
export class InvalidInput extends AuthzError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, InvalidInput.prototype);
    }
}

export class InvalidState extends AuthzError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, InvalidState.prototype);
    }
}

