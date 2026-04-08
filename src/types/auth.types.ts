import type { ProfileOut } from "./profile.types";
export type RegisterIn = { email: string; password: string };
export type LoginIn = { email: string; password: string };

export type UserOut = { id: number; email: string };


export type AuthWithProfileOut = {
    access_token: string;
    token_type: "bearer";
    user: UserOut;
    profile: ProfileOut;
};

export type VerifyOut = { sub: string; email: string };
