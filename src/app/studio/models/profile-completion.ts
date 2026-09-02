export interface ProfileCompletionStep{
    title: string;
    isCompleted: boolean;
    description?: string;
}

export interface ProfileCompletionResult{
    steps: ProfileCompletionStep[];
    percentage: number;
}