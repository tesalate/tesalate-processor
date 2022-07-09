import { Schema, SchemaOptions } from 'mongoose';

const objectIdToString = () => {
  // default mongoose ObjectId to string
  Schema.Types.ObjectId.get((v) => (v !== null ? v.toString() : v));

  const optionKeys: Array<keyof SchemaOptions> = ['toObject', 'toJSON'];

  return (schema: Schema) => {
    optionKeys.forEach((optionKey) => {
      if (schema.get(optionKey) === null) {
        schema.set(optionKey, {
          getters: true,
        });
      }
    });
  };
};
export default objectIdToString;
