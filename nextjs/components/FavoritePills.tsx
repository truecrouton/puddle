'use client';

import { sortArray } from '@/lib/utilities';
import FavoritePill from './FavoritePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { redirect } from 'next/navigation';
import { Favorite } from "puddle-graphql";
import { useMemo } from 'react';

interface FavoritePillsProps {
    queryRef: QueryRef<any>;
}

export default function FavoritePills({ queryRef }: FavoritePillsProps) {
    const { data } = useReadQuery(queryRef);
    const favorites = data.favorites as Favorite[];

    const handleRowClick = (favorite: Favorite) => {
        redirect('/charts');
    };

    const sortedFavorites = useMemo(() => {
        return sortArray(favorites, 'name');
    }, [favorites]);

    let pillKey = 0;
    return (
        <div className="bg-base-100 pb-4">
            <div className="flex flex-wrap gap-3 mb-8">
                {sortedFavorites.map((favorite) => {
                    pillKey++;
                    return <FavoritePill favorite={favorite} onClick={() => handleRowClick(favorite)} key={pillKey} />;
                })}
            </div>
        </div>
    );
}