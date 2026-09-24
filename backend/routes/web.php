<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GoogleAuthController;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/auth/google/redirect',[GoogleAuthController::class,'redirect'])->middleware('throttle:10,1');
Route::get('/auth/google/callback',[GoogleAuthController::class,'callback'])->middleware('throttle:10,1');
