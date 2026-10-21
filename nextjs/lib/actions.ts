// app/actions/book-actions.ts
'use server';

import { getClient } from "@/lib/apollo-server";
import { UPSERT_DEVICE } from "./queries";
import { validatedAction } from "./validated-action";
import { UpsertDeviceInputSchema } from "@/generated/zod-schemas";

export const upsertDevice = validatedAction(UpsertDeviceInputSchema, async (input) => {
    const client = getClient();

    // Execute the GraphQL mutation via Apollo Client
    const { data } = await client.mutate({
        mutation: UPSERT_DEVICE,
        variables: { input },
    });

    return data?.upsertDevice;
});