<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RingkasanHarian extends Notification
{
    use Queueable;

    /**
     * @param  array<int,string>  $terlambat   baris teks, mis. "Rina (masuk 08:12)"
     * @param  array<int,string>  $belumHadir  baris teks, mis. "Budi (Shift Pagi 07:00-15:00)"
     */
    public function __construct(
        protected string $namaBisnis,
        protected string $tanggal,
        protected array $terlambat,
        protected array $belumHadir
    ) {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Ringkasan presensi {$this->namaBisnis} - {$this->tanggal}")
            ->greeting("Halo, {$notifiable->name}!")
            ->line("Berikut hal yang perlu Anda ketahui dari presensi hari ini ({$this->tanggal}).");

        if ($this->terlambat) {
            $mail->line('**Terlambat (' . count($this->terlambat) . ' orang):**');
            foreach ($this->terlambat as $baris) {
                $mail->line('- ' . $baris);
            }
        }

        if ($this->belumHadir) {
            $mail->line('**Terjadwal tapi tidak ada presensi dan tidak ada izin (' . count($this->belumHadir) . ' orang):**');
            foreach ($this->belumHadir as $baris) {
                $mail->line('- ' . $baris);
            }
            $mail->line('Kalau mereka sebenarnya hadir (mis. lupa absen), koreksi lewat menu Laporan Presensi.');
        }

        return $mail
            ->action('Buka Laporan Presensi', rtrim(config('langganan.frontend_url'), '/') . '/admin/presensi')
            ->line('Email ini dikirim hanya pada hari ada yang terlambat atau tidak hadir. Matikan lewat menu Profil > Ringkasan harian.');
    }
}
