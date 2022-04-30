// user initial info
export interface UserSettingDto {
    readonly nickname?: string,
    readonly dtype?: number[],
    readonly time?: string[]
}

export interface UserSetTime {
    // [ time: string ]: boolean
    morning?: boolean,
    afternoon?: boolean,
    night?: boolean,
}

export interface UserSetCategory {
    user_id?: number,
    category_id?: number,
    next_item_id?: number,
}

export type ResetCategoryDto = ResetCategory[]

export interface ResetCategory {
    readonly 0?: boolean,
    readonly 1?: boolean,
    readonly 2?: boolean,
    readonly 3?: boolean,
}