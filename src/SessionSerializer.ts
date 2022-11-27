import * as devalue from "devalue";

export interface SessionSerializerInterface {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  deserialize(input: string | null): Record<string, any>;

  serialize(data: Record<string, any>): string;
}

export const devalueSerializer: SessionSerializerInterface = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  deserialize(input: string | null): Record<string, any> {
    if (input === null) return {};
    return devalue.parse(input);
  },

  serialize(data: Record<string, any>): string {
    return devalue.stringify(data);
  },
};
