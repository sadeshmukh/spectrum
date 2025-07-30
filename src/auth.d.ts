declare module "@auth/core/types" {
  interface User {
    isAdmin?: boolean;
    isPublic?: boolean;
    publicUsername?: string;
  }
}
