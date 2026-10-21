'use client';

import { GET_FAVORITES } from "@/lib/queries";
import { ResultOf } from '@graphql-typed-document-node/core';
import FavoritePill from './FavoritePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { MousePointer2 } from "lucide-react";
import { redirect } from 'next/navigation';

type GetFavoritesResult = ResultOf<typeof GET_FAVORITES>;
type Favorite = GetFavoritesResult['favorites'][number];

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
        <div className="bg-base-100 pb-8">
            <div className="flex flex-wrap gap-3 mb-8">
                {favorites.map((favorite) => {
                    pillKey++;
                    return <FavoritePill favorite={favorite} onClick={() => handleRowClick(favorite)} key={pillKey} />;
                })}
            </div>
            <div className="flex flex-wrap gap-3">
                <MousePointer2 className="w-12 h-12" />
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/control'>
                    <div className="text-left">
                        <h3 className="font-bold">Control</h3>
                    </div>
                </a>
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/devices'>
                    <div className="text-left">
                        <h3 className="font-bold">Devices</h3>
                    </div>
                </a>
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/automations'>
                    <div className="text-left">
                        <h3 className="font-bold">Automations</h3>
                    </div>
                </a>
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/topics'>
                    <div className="text-left">
                        <h3 className="font-bold">Topics</h3>
                    </div>
                </a>
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/schedule'>
                    <div className="text-left">
                        <h3 className="font-bold">Schedule</h3>
                    </div>
                </a>
                <a className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href='/charts'>
                    <div className="text-left">
                        <h3 className="font-bold">Charts</h3>
                    </div>
                </a>
            </div>
        </div>
    );
}