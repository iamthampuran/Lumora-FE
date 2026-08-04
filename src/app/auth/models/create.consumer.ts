export interface CreateConsumer{
    userId: string;
    fullName: string;
    phoneNumber: string;
    photoUrl: string | null;
    bio: string | null;
    formFile: File | null;
}