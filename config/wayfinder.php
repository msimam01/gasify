<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Groups
    |--------------------------------------------------------------------------
    |
    | Here you may define which route groups to include when generating
    | TypeScript types. By default, all routes will be included.
    |
    */
    'groups' => [
        // 'web',
        // 'api',
    ],

    /*
    |--------------------------------------------------------------------------
    | Excluded Routes
    |--------------------------------------------------------------------------
    |
    | Here you may specify route names that should be excluded from the
    | generated TypeScript types.
    |
    */
    'exclude' => [
        // 'route.name.to.exclude',
    ],

    /*
    |--------------------------------------------------------------------------
    | Generated File Path
    |--------------------------------------------------------------------------
    |
    | Here you may specify the path where the TypeScript types will be
    | generated. The path is relative to your project's root directory.
    |
    */
    'output' => 'resources/js/types/wayfinder.d.ts',
];
