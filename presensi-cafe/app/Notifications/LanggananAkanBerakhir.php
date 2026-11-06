<?php

namespace App\Notifications;

use App\Models\Langganan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LanggananAkanBerakhir extends Notification
{
    use Queueable;

    public function __construct(protected Langganan $langganan, protected int $sisaHari)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $bisnis = $this->langganan->bisnis;
        $trial = $this->langganan->status === 'trial';
        $tanggal = $this->langganan->berakhir_at->locale('id')->translatedFormat('d M Y');

        return (new MailMessage)
            ->subject("Langganan {$bisnis->nama_bisnis} berakhir {$this->sisaHari} hari lagi")
            ->greeting("Halo, {$notifiable->name}!")
            ->line($trial
                ? "Masa uji coba gratis \"{$bisnis->nama_bisnis}\" berakhir dalam {$this->sisaHari} hari (pada {$tanggal})."
                : "Paket {$this->langganan->paket->nama} \"{$bisnis->nama_bisnis}\" berakhir dalam {$this->sisaHari} hari (pada {$tanggal}).")
            ->line('Setelah berakhir, pegawai tidak bisa presensi sampai langganan diperpanjang.')
            ->action('Perpanjang Langganan', rtrim(config('langganan.frontend_url'), '/') . '/admin/langganan')
            ->line('Kalau sudah diperpanjang, abaikan email ini.');
    }
}
