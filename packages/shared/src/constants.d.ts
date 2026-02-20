export declare const CHUNK_SIZE = 16;
export declare const CHUNK_VOLUME: number;
export declare const WORLD_HEIGHT_CHUNKS = 16;
export declare const WORLD_HEIGHT: number;
export declare const SEA_LEVEL = 64;
export declare const BLOCK_MATERIALS: {
    readonly AIR: 0;
    readonly STONE: 1;
    readonly DIRT: 2;
    readonly GRASS: 3;
    readonly SAND: 4;
    readonly WATER: 5;
    readonly WOOD: 6;
    readonly LEAVES: 7;
    readonly GLASS: 8;
    readonly BRICK: 9;
    readonly METAL: 10;
    readonly CONCRETE: 11;
    readonly GLOW: 12;
};
export type BlockMaterialId = (typeof BLOCK_MATERIALS)[keyof typeof BLOCK_MATERIALS];
export declare const BLOCK_COLORS: Record<number, string>;
export declare const BLOCK_NAMES: Record<number, string>;
export declare const ROLES: {
    readonly OWNER: "owner";
    readonly ADMIN: "admin";
    readonly BUILDER: "builder";
    readonly VIEWER: "viewer";
    readonly AGENT: "agent";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
export declare const ROLE_PERMISSIONS: Record<Role, Set<string>>;
export declare const DEFAULT_RATE_LIMITS: {
    readonly agent: 120;
    readonly user: 60;
    readonly ip: 30;
};
export declare const TOOLS: {
    readonly PLACE: "place";
    readonly REMOVE: "remove";
    readonly PAINT: "paint";
    readonly SELECT: "select";
    readonly MOVE: "move";
    readonly ROTATE: "rotate";
};
export type Tool = (typeof TOOLS)[keyof typeof TOOLS];
//# sourceMappingURL=constants.d.ts.map