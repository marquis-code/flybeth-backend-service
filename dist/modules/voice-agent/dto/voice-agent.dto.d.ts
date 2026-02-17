export declare class StartSessionDto {
    metadata?: Record<string, any>;
    language?: string;
}
export declare class ProcessTextDto {
    text: string;
    context?: Record<string, any>;
}
export declare class ProcessAudioDto {
    audioUrl?: string;
    options?: Record<string, any>;
}
export declare class ResumeSessionDto {
    draftId?: string;
}
export declare class SupportQueryDto {
    query: string;
    bookingId?: string;
    context?: Record<string, any>;
}
