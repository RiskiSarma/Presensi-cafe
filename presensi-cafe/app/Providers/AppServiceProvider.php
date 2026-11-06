<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Link reset password mengarah ke frontend Next.js, bukan ke route web Laravel
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return rtrim(config('langganan.frontend_url'), '/')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($user->getEmailForPasswordReset());
        });

        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $url = rtrim(config('langganan.frontend_url'), '/')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

            return (new MailMessage)
                ->subject('Atur ulang password Presensi Cafe')
                ->greeting("Halo, {$notifiable->name}!")
                ->line('Kami menerima permintaan untuk mengatur ulang password akun Presensi Cafe Anda.')
                ->action('Buat Password Baru', $url)
                ->line('Link ini berlaku 60 menit dan hanya bisa dipakai sekali.')
                ->line('Kalau Anda tidak merasa meminta ini, abaikan saja email ini. Password Anda tidak berubah.');
        });
    }
}
