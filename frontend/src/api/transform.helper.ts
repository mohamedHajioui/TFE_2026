import {type ClassConstructor, plainToInstance} from "class-transformer";


/**
 * Transforme un objet JSON brut en instance d'une classe
 */
export function toModel<T>(cls: ClassConstructor<T>, plain: object): T {
    return plainToInstance(cls, plain, {
        excludeExtraneousValues: true, // Ignore les champs sans @Expose()
        enableImplicitConversion: true,
    });
}

/**
 * Transforme un tableau JSON brut en tableau d'instances
 */
export function toModels<T>(cls: ClassConstructor<T>, plains: object[]): T[] {
    return plains.map((plain) => toModel(cls, plain));
}