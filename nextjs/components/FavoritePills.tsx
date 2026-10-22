'use client';

import FavoritePill from './FavoritePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { MousePointer2 } from "lucide-react";
import { redirect } from 'next/navigation';
import { Favorite } from "puddle-graphql";

interface FavoritePillsProps {
    queryRef: QueryRef<any>;
}

export default function FavoritePills({ queryRef }: FavoritePillsProps) {
    const { data } = useReadQuery(queryRef);
    const favorites = data.favorites as Favorite[];

    const handleRowClick = (favorite: Favorite) => {
        redirect('/charts');
    };

    let pillKey = 0;
    return (
        <div className="bg-base-100 pb-4">
            <div className="flex flex-wrap gap-3 mb-8">
                {favorites.map((favorite) => {
                    pillKey++;
                    return <FavoritePill favorite={favorite} onClick={() => handleRowClick(favorite)} key={pillKey} />;
                })}
            </div>
        </div>
    );
}