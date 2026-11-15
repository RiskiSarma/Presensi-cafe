<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifikasiEmail extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute('email.verifikasi', now()->addHours(24), [
            'id' => $notifiable->id,
            'hash' => sha1($notifiable->email),
        ]);

        return (new MailMessage)
            ->subject('Verifikasi email Presensi Cafe')
            ->greeting("Halo, {$notifiable->name}!")
            ->line('Terima kasih sudah mendaftar. Klik tombol di bawah untuk memastikan email ini benar milik Anda.')
            ->action('Verifikasi Email', $url)
            ->line('Link berlaku 24 jam. Kalau Anda tidak merasa mendaftar, abaikan email ini.');
    }
}
