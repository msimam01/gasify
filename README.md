cd /home/msimam/Gasify && php artisan queue:work --queue=default --sleep=1 --tries=1 --timeout=120
f you want to run it immediately, execute:
php artisan queue:work (ensure it’s running)
php artisan tinker
dispatch(new App\Jobs\UpdateWalletBalances);
Then check storage/logs/laravel.log for “UpdateWalletBalances job started!” and “Updating balance …”.
