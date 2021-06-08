import { DeepPartial } from "../../../common/DeepPartial"
import { AnyDataSource } from "../data-source"
import { EntitySchemaComputedModel } from "../options"
import { FlatTypeHint, UndefinedToOptional, UnionToIntersection } from "../util"
import { ColumnCompileType, EntityColumn } from "./entity-columns"
import {
  AnyEntity,
  AnyEntitySchema,
  EntityClassInstance,
  RelationEntity,
} from "./entity-core"
import { EntityRelationReferencedColumnTypeMap } from "./entity-referenced-columns"

/**
 * Returns entity type for a given entity.
 */
export type EntityModel<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity
> = Entity extends AnyEntitySchema
  ? EntitySchemaComputedModel<
      DataSource,
      Entity,
      {},
      {}, // todo
      false,
      "all"
    >
  : Entity extends EntityClassInstance
  ? Entity
  : unknown

/**
 * Deep partial entity type of a given entity.
 */
export type EntityModelPartial<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity
> = DeepPartial<EntityModel<DataSource, Entity>>

/**
 * Input model of the "entity create" operation.
 */
export type EntityCreateParams<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity
> = Entity extends AnyEntitySchema
  ? DeepPartial<
      EntitySchemaComputedModel<
        DataSource,
        Entity,
        {},
        {}, // todo
        false,
        "create"
      >
    >
  : DeepPartial<Entity>

/**
 * Result of the "entity create" operation.
 */
export type CreatedEntityModel<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity,
  Model extends EntityCreateParams<DataSource, Entity>
> = Entity extends AnyEntitySchema
  ? Model &
      EntitySchemaComputedModel<
        DataSource,
        Entity,
        {},
        {}, // todo
        false,
        "virtuals"
      >
  : Entity

/**
 * Result of the "entity merge" operation.
 */
export type MergedEntityModel<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity,
  Models extends EntityCreateParams<DataSource, Entity>[]
> = Entity extends AnyEntitySchema
  ? UnionToIntersection<Models[number]>
  : Entity

/**
 * Result of the "entity insert" operation.
 *
 * For entity schemas it does:
 *
 * Merges generated columns, default columns into given partial entity model.
 * This type is used after "insert" operation is performed.
 * The reason why this type exists - because when user uses "insert" method he might not
 * provide all entity data and some data can be generated by a database for him.
 * In such cases database returns those values to "insert" method and "insert" method returns them back to user.
 *
 * For entity classes it simply returns entity instance.
 */
export type InsertedEntityModel<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity,
  Model
> = Entity extends AnyEntitySchema
  ? Model &
      EntitySchemaComputedModel<
        DataSource,
        Entity,
        {},
        {}, // todo
        false,
        "all"
      > // todo: fix SelectAll please
  : Entity

/**
 * Prepare a given column compile type for insertion.
 * For example, its not necessary to specify columns with "default" on insertion.
 * Or "generated" columns also optional because db can generate a value for consumer.
 * Or nullable columns can be omitted because database will insert NULL for them.
 */
export type ColumnCompileTypeForInsert<
  Column extends EntityColumn<AnyDataSource>,
  CompileType
> = Column["default"] extends string | number | boolean
  ? CompileType | undefined
  : Column["generated"] extends true
  ? CompileType | undefined
  : Column["nullable"] extends true
  ? CompileType | undefined
  : CompileType

/**
 * Entity blueprint that can be used in "insert" operation.
 *
 * Implementation notes:
 *  - UndefinedToOptional is used because built object contains values marked as type | undefined,
 *    but they still aren't optional in the object. To make their undefined-s really useful we need to mark
 *    them as optional in the built object.
 *  - FlatTypeHint is used to improve type hinting when this type is directly used
 */
export type EntityInsertParams<
  DataSource extends AnyDataSource,
  Entity extends AnyEntity
> = Entity extends AnyEntitySchema
  ? FlatTypeHint<
      UndefinedToOptional<
        {
          [P in keyof (Entity["columns"] &
            Entity["embeds"] &
            Entity["relations"])]: P extends string & keyof Entity["columns"]
            ? ColumnCompileTypeForInsert<
                Entity["columns"][P],
                ColumnCompileType<DataSource, Entity, P>
              >
            : P extends keyof Entity["embeds"]
            ? EntityInsertParams<DataSource, Entity["embeds"][P]>
            : P extends keyof Entity["relations"]
            ?
                | EntityRelationReferencedColumnTypeMap<
                    DataSource,
                    RelationEntity<Entity, P>,
                    Entity["relations"][P]
                  >
                | undefined
            : never
        }
      >
    >
  : DeepPartial<Entity>

/**
 * Extracts entity's (represented as class) possible relations and embeds.

export type EntityClassRelationAndEmbedKeys<
  Entity extends EntityClassInstance
> = {
  [P in keyof Entity]?: Entity[P] extends Array<infer U>
    ? U extends EntityClassDefinition
      ? P
      : never
    : Entity[P] extends EntityClassDefinition
    ? P
    : never
}[keyof Entity]
 */
