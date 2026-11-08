-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.33 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             11.2.0.6213
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for presensi_cafe
CREATE DATABASE IF NOT EXISTS `presensi_cafe` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `presensi_cafe`;

-- Dumping structure for table presensi_cafe.bisnis
CREATE TABLE IF NOT EXISTS `bisnis` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nama_bisnis` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('trial','aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trial',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `fitur_override` json DEFAULT NULL,
  `batas_override` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bisnis_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.bisnis: ~2 rows (approximately)
/*!40000 ALTER TABLE `bisnis` DISABLE KEYS */;
INSERT INTO `bisnis` (`id`, `nama_bisnis`, `slug`, `email_owner`, `status`, `created_at`, `updated_at`, `fitur_override`, `batas_override`) VALUES
	(1, 'Kopi Analogi', 'kopi-analogi', 'admin@cafe.com', 'aktif', '2026-08-20 10:44:42', '2026-08-20 10:44:42', NULL, NULL),
	(2, 'HOCO', 'hoco-do8U', 'sarma@gmail.com', 'aktif', '2026-08-30 13:23:42', '2026-08-30 13:23:48', NULL, NULL);
/*!40000 ALTER TABLE `bisnis` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.cabangs
CREATE TABLE IF NOT EXISTS `cabangs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bisnis_id` bigint(20) unsigned DEFAULT NULL,
  `nama_cabang` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cabang Utama',
  `alamat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `radius_meter` int(10) unsigned NOT NULL DEFAULT '100',
  `kiosk_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cabangs_kiosk_token_unique` (`kiosk_token`),
  KEY `cabangs_bisnis_id_foreign` (`bisnis_id`),
  CONSTRAINT `cabangs_bisnis_id_foreign` FOREIGN KEY (`bisnis_id`) REFERENCES `bisnis` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.cabangs: ~2 rows (approximately)
/*!40000 ALTER TABLE `cabangs` DISABLE KEYS */;
INSERT INTO `cabangs` (`id`, `bisnis_id`, `nama_cabang`, `alamat`, `latitude`, `longitude`, `radius_meter`, `kiosk_token`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Cabang Utama', 'Ganti dengan alamat cafe kamu', 5.5612946, 95.3212743, 10, 'R3Xwq3kpQH4pjfoSdKLCDqDDvftnmi1G4d8vUhQDhDNOjjGS', 1, '2026-08-20 10:44:43', '2026-08-25 14:25:23'),
	(2, 2, 'HOCO', NULL, 0.0000000, 0.0000000, 10, 'EbpR9cFbz7lIDDKNDOm9jsPNbats9PzDjssAfZrDLlrQsUxc', 1, '2026-08-30 13:27:46', '2026-08-30 13:43:36');
/*!40000 ALTER TABLE `cabangs` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.cache: ~0 rows (approximately)
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.cache_locks: ~0 rows (approximately)
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.face_embeddings
CREATE TABLE IF NOT EXISTS `face_embeddings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pegawai_profil_id` bigint(20) unsigned NOT NULL,
  `embedding_vector` json NOT NULL,
  `foto_referensi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `face_embeddings_pegawai_profil_id_foreign` (`pegawai_profil_id`),
  CONSTRAINT `face_embeddings_pegawai_profil_id_foreign` FOREIGN KEY (`pegawai_profil_id`) REFERENCES `pegawai_profils` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.face_embeddings: ~0 rows (approximately)
/*!40000 ALTER TABLE `face_embeddings` DISABLE KEYS */;
INSERT INTO `face_embeddings` (`id`, `pegawai_profil_id`, `embedding_vector`, `foto_referensi`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 1, '[-0.11031843721866608, 0.02103858068585396, 0.03625626116991043, -0.09840884059667589, 0.003367573721334338, -0.06595910340547562, 0.026986578479409214, -0.1568257361650467, 0.11284270137548448, -0.12687727808952332, 0.24918539822101593, -0.0840597078204155, -0.21575699746608737, -0.14540503919124603, -0.04408523440361023, 0.15611231327056885, -0.16877993941307068, -0.09794355928897858, -0.06472540646791458, -0.03408138081431389, 0.09080831706523897, -0.0020717307925224304, 0.0028148582205176353, 0.07139674574136734, -0.08060962706804276, -0.3426981270313263, -0.1114732027053833, -0.08842451125383377, -0.04246058315038681, -0.05229755491018295, 0.04944397881627083, 0.08174147456884384, -0.1933356523513794, 0.0006015695980750024, -0.05949709191918373, 0.029692254960536957, -0.0018703070236369967, -0.03472720831632614, 0.1804228574037552, -0.0010560997761785984, -0.18546973168849945, -0.058411095291376114, 0.016812674701213837, 0.21500124037265775, 0.1502360701560974, 0.04858439788222313, -0.017456073313951492, -0.021158481016755104, 0.06831268966197968, -0.24560333788394928, 0.009599050506949425, 0.08204023540019989, 0.06253685057163239, 0.02040719799697399, 0.05729229748249054, -0.10517366975545885, -0.0007886210223659873, 0.034574780613183975, -0.14519554376602173, 0.02034262008965015, -0.038338955491781235, -0.15450213849544525, -0.026898184791207314, -0.0451391376554966, 0.20187871158123016, 0.0742204561829567, -0.14544682204723358, -0.07362059503793716, 0.1536007672548294, -0.1504521667957306, -0.06989538669586182, 0.03891541436314583, -0.10673732310533524, -0.16258449852466583, -0.3865121006965637, 0.04806281626224518, 0.4055953323841095, 0.10234858095645905, -0.20378905534744263, -0.014200023375451565, -0.06786081194877625, 0.0005751895369030535, 0.15715661644935608, 0.11619682610034944, -0.00737603846937418, -0.01757640764117241, -0.12324991077184676, -0.0001007058162940666, 0.15083302557468414, -0.05864014849066734, -0.11398952454328536, 0.22882629930973053, -0.06995590031147003, 0.08419134467840195, -0.025109121575951576, 0.06411190330982208, -0.03299230709671974, 0.02887970767915249, -0.06101394444704056, 0.05381842702627182, 0.12391935288906096, 0.005556565709412098, -0.027248581871390343, 0.1589750051498413, -0.09631413966417313, 0.0924835279583931, -0.004192540422081947, -0.014026181772351263, 0.01974218338727951, 0.04258342459797859, -0.14912281930446625, -0.09044559299945833, 0.06707194447517395, -0.2199607938528061, 0.1545667052268982, 0.19753722846508023, -0.04817657172679901, 0.11731397360563278, 0.06898467987775803, 0.06301955878734589, -0.020280342549085617, -0.03232259303331375, -0.18646280467510223, -0.0821770429611206, 0.11701270192861556, 0.0474776029586792, 0.05064348503947258, -0.006917653605341911]', 'wajah-referensi/glY4QWo1GKzeGcSuWK2xXo0fMWG2CTafpWA7KN64.jpg', 0, '2026-08-20 14:42:05', '2026-08-25 14:07:13'),
	(2, 1, '[-0.10737009346485138, 0.054727256298065186, 0.03582565486431122, -0.10731665045022964, 0.030985243618488312, -0.09915302693843842, 0.005616779439151287, -0.1274242103099823, 0.1112072616815567, -0.13985575735569, 0.2697981297969818, -0.1457245796918869, -0.1759222149848938, -0.17570926249027252, 0.003736670594662428, 0.13930170238018036, -0.1979837268590927, -0.12101877480745316, -0.0686144158244133, -0.015893464908003807, 0.09159868955612184, 0.00911687407642603, 0.017435336485505104, 0.07376639544963837, -0.11150911450386047, -0.3976077139377594, -0.11357581615447998, -0.08235970139503479, -0.036243148148059845, -0.0588410347700119, 0.0070328181609511375, 0.09129362553358078, -0.16089695692062378, -0.0041596656665205956, -0.008273319341242313, 0.05455318093299866, 0.024902042001485825, -0.02348216250538826, 0.15185441076755524, 0.01111662294715643, -0.20375977456569672, -0.04945438355207443, 0.05690693110227585, 0.29460424184799194, 0.21181166172027588, 0.0450400784611702, -0.07183387130498886, -0.022600620985031128, 0.11572638154029846, -0.233625590801239, 0.013379769399762154, 0.10253430157899857, 0.09391795098781586, -0.02944854646921158, 0.1285337209701538, -0.02558431215584278, 0.01556374691426754, 0.06410818547010422, -0.19014456868171692, -0.0027065412141382694, -0.00180525507312268, -0.1105339303612709, -0.036960113793611526, -0.0639156624674797, 0.17296093702316284, 0.0936465784907341, -0.12790732085704803, -0.06858112663030624, 0.15185044705867767, -0.12872019410133362, -0.0453735888004303, 0.03976903483271599, -0.11577140539884569, -0.1879217028617859, -0.2949371337890625, -0.008867419324815273, 0.40274447202682495, 0.0911506935954094, -0.19293329119682312, 0.031084680929780006, -0.02757293172180653, -0.03896234929561615, 0.17865140736103058, 0.0767391175031662, -0.054783981293439865, -0.01184608694165945, -0.1343800276517868, 0.058410536497831345, 0.16904783248901367, -0.051255661994218826, -0.0546436682343483, 0.22228975594043732, -0.09667897969484328, 0.038193270564079285, 0.01264004223048687, -0.006667503155767918, -0.05393792316317558, 0.07281035929918289, -0.1392861008644104, 0.01433939766138792, 0.12241160869598389, -0.04267146438360214, -0.04124654084444046, 0.11656690388917924, -0.14682093262672424, 0.07169714570045471, 0.05153803527355194, -0.008457356132566929, 0.04799262434244156, 0.010027087293565272, -0.1338522881269455, -0.06583090871572495, 0.06503251194953918, -0.2169329822063446, 0.11072738468647005, 0.15507672727108002, -0.0014497321099042892, 0.10467493534088136, 0.05009069666266441, 0.013394883833825588, 0.011020810343325138, -0.06008165329694748, -0.18794701993465424, -0.04812588170170784, 0.1093587651848793, 0.035201165825128555, 0.059064868837594986, -0.03989524394273758]', 'wajah-referensi/kVtQ7LvFIlsyxNCwJFoYcKoP6U9ovTkHToF1Q8Sr.jpg', 1, '2026-08-25 14:07:13', '2026-08-25 14:07:13'),
	(3, 3, '[-0.10643002390861513, 0.05840081349015236, 0.0486394539475441, -0.0922965407371521, 0.02043822593986988, -0.10056350380182266, 0.019442105665802956, -0.12555409967899325, 0.0883256271481514, -0.11956005543470384, 0.27920475602149963, -0.1121181920170784, -0.16871748864650726, -0.1879273951053619, 0.016524212434887886, 0.1351729780435562, -0.20226211845874784, -0.10600776970386504, -0.07065422087907791, -0.035442549735307693, 0.07091778516769409, 0.030043359845876697, 0.01390754897147417, 0.052404094487428665, -0.1234162375330925, -0.3830280900001526, -0.08436892926692963, -0.09313599765300752, -0.04425252228975296, -0.08583199977874756, 0.05885053053498268, 0.10596998035907744, -0.16279269754886627, 0.010951291769742966, -0.02057834155857563, 0.04186175763607025, 0.025102591142058372, -0.008819513022899628, 0.15385541319847107, 0.03664982318878174, -0.1804455816745758, -0.06700200587511063, 0.04546235874295235, 0.31732863187789917, 0.196720153093338, 0.008066238835453987, -0.05655506998300552, 0.019158603623509407, 0.11552289128303528, -0.2576291859149933, 0.012901518493890762, 0.06560099869966507, 0.1303097903728485, -0.02674221992492676, 0.12813761830329895, -0.03628987446427345, 0.002941818442195654, 0.05733257904648781, -0.19807514548301697, 0.013266988098621368, -0.010447622276842594, -0.1045106053352356, -0.05593832582235336, -0.0594104528427124, 0.17582978308200836, 0.08667023479938507, -0.1362842470407486, -0.032093971967697144, 0.11109193414449692, -0.120686374604702, -0.05409734323620796, 0.03361064940690994, -0.10566902160644533, -0.18289504945278168, -0.3151574730873108, 0.0032455995678901672, 0.3829757273197174, 0.09499257057905196, -0.2237466126680374, -0.007437892258167267, -0.019109096378087997, -0.020959101617336273, 0.16153673827648163, 0.07508902251720428, -0.0595337338745594, 0.011122551746666431, -0.11196794360876083, 0.062101367861032486, 0.13566991686820984, -0.0454428568482399, -0.07702820748090744, 0.23266394436359408, -0.0924791693687439, 0.03330382704734802, -0.0008889684686437249, -0.03483666852116585, -0.027745163068175316, 0.04775117710232735, -0.1064285933971405, 0.013804873451590538, 0.10665047913789748, -0.05342688038945198, -0.032458994537591934, 0.1071019396185875, -0.15565937757492063, 0.10073735564947128, 0.05520126596093178, -0.002263045171275735, 0.05033999681472778, 0.023988520726561543, -0.1262471228837967, -0.06415832787752151, 0.06793885678052902, -0.22350335121154785, 0.10741187632083891, 0.17247778177261353, -0.0400056354701519, 0.11995050311088562, 0.02634294517338276, 0.0072118910029530525, -0.010285990312695503, -0.0345890112221241, -0.14696507155895233, -0.048890452831983566, 0.1030922457575798, 0.02236761339008808, 0.05073919519782066, -0.04901017248630524]', 'wajah-referensi/rXFyH1cdkcBaCmnEd4X6A4L7RG96EtWPiR2okkXl.jpg', 1, '2026-08-30 13:29:47', '2026-08-30 13:29:47');
/*!40000 ALTER TABLE `face_embeddings` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.failed_jobs: ~0 rows (approximately)
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.jadwal_angsuran
CREATE TABLE IF NOT EXISTS `jadwal_angsuran` (
  `KONTRAK_NO` varchar(20) NOT NULL,
  `ANGSURAN_KE` int(11) NOT NULL,
  `ANGSURAN_PER_BULAN` decimal(15,2) NOT NULL,
  `TANGGAL_JATUH_TEMPO` date NOT NULL,
  PRIMARY KEY (`KONTRAK_NO`,`ANGSURAN_KE`),
  CONSTRAINT `jadwal_angsuran_ibfk_1` FOREIGN KEY (`KONTRAK_NO`) REFERENCES `kontrak` (`KONTRAK_NO`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table presensi_cafe.jadwal_angsuran: ~12 rows (approximately)
/*!40000 ALTER TABLE `jadwal_angsuran` DISABLE KEYS */;
INSERT INTO `jadwal_angsuran` (`KONTRAK_NO`, `ANGSURAN_KE`, `ANGSURAN_PER_BULAN`, `TANGGAL_JATUH_TEMPO`) VALUES
	('AGR00001', 1, 12907000.00, '2024-01-25'),
	('AGR00001', 2, 12907000.00, '2024-02-25'),
	('AGR00001', 3, 12907000.00, '2024-03-25'),
	('AGR00001', 4, 12907000.00, '2024-04-25'),
	('AGR00001', 5, 12907000.00, '2024-05-25'),
	('AGR00001', 6, 12907000.00, '2024-06-25'),
	('AGR00001', 7, 12907000.00, '2024-07-25'),
	('AGR00001', 8, 12907000.00, '2024-08-25'),
	('AGR00001', 9, 12907000.00, '2024-09-25'),
	('AGR00001', 10, 12907000.00, '2024-10-25'),
	('AGR00001', 11, 12907000.00, '2024-11-25'),
	('AGR00001', 12, 12907000.00, '2024-12-25');
/*!40000 ALTER TABLE `jadwal_angsuran` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.jadwal_shifts
CREATE TABLE IF NOT EXISTS `jadwal_shifts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pegawai_profil_id` bigint(20) unsigned NOT NULL,
  `shift_id` bigint(20) unsigned NOT NULL,
  `tanggal` date NOT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jadwal_shifts_pegawai_profil_id_tanggal_unique` (`pegawai_profil_id`,`tanggal`),
  KEY `jadwal_shifts_shift_id_foreign` (`shift_id`),
  CONSTRAINT `jadwal_shifts_pegawai_profil_id_foreign` FOREIGN KEY (`pegawai_profil_id`) REFERENCES `pegawai_profils` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jadwal_shifts_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.jadwal_shifts: ~0 rows (approximately)
/*!40000 ALTER TABLE `jadwal_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `jadwal_shifts` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.jobs: ~0 rows (approximately)
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.job_batches: ~0 rows (approximately)
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.kontrak
CREATE TABLE IF NOT EXISTS `kontrak` (
  `KONTRAK_NO` varchar(20) NOT NULL,
  `CLIENT_NAME` varchar(100) NOT NULL,
  `OTR` decimal(15,2) NOT NULL,
  PRIMARY KEY (`KONTRAK_NO`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table presensi_cafe.kontrak: ~0 rows (approximately)
/*!40000 ALTER TABLE `kontrak` DISABLE KEYS */;
INSERT INTO `kontrak` (`KONTRAK_NO`, `CLIENT_NAME`, `OTR`) VALUES
	('AGR00001', 'SUGUS', 240000000.00);
/*!40000 ALTER TABLE `kontrak` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.langganans
CREATE TABLE IF NOT EXISTS `langganans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bisnis_id` bigint(20) unsigned NOT NULL,
  `paket_id` bigint(20) unsigned NOT NULL,
  `siklus` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bulanan',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `mulai_at` datetime NOT NULL,
  `berakhir_at` datetime NOT NULL,
  `pembayaran_id` bigint(20) unsigned DEFAULT NULL,
  `catatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `reminder_3d_sent_at` timestamp NULL DEFAULT NULL,
  `reminder_1d_sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `langganans_paket_id_foreign` (`paket_id`),
  KEY `langganans_bisnis_id_berakhir_at_index` (`bisnis_id`,`berakhir_at`),
  CONSTRAINT `langganans_bisnis_id_foreign` FOREIGN KEY (`bisnis_id`) REFERENCES `bisnis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `langganans_paket_id_foreign` FOREIGN KEY (`paket_id`) REFERENCES `paket` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.langganans: ~2 rows (approximately)
/*!40000 ALTER TABLE `langganans` DISABLE KEYS */;
INSERT INTO `langganans` (`id`, `bisnis_id`, `paket_id`, `siklus`, `status`, `mulai_at`, `berakhir_at`, `pembayaran_id`, `catatan`, `created_at`, `updated_at`, `reminder_3d_sent_at`, `reminder_1d_sent_at`) VALUES
	(1, 1, 2, 'bulanan', 'aktif', '2026-10-30 10:26:57', '2026-11-29 10:26:57', NULL, 'Langganan awal hasil backfill', '2026-10-30 10:26:57', '2026-10-30 10:26:57', NULL, NULL),
	(2, 2, 2, 'bulanan', 'aktif', '2026-10-30 10:26:57', '2026-11-29 10:26:57', NULL, 'Langganan awal hasil backfill', '2026-10-30 10:26:57', '2026-10-30 10:26:57', NULL, NULL);
/*!40000 ALTER TABLE `langganans` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.migrations: ~19 rows (approximately)
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1),
	(2, '0001_01_01_000001_create_cache_table', 1),
	(3, '0001_01_01_000002_create_jobs_table', 1),
	(4, '2024_01_01_000001_add_role_to_users_table', 1),
	(5, '2024_01_01_000002_create_cafe_settings_table', 1),
	(6, '2024_01_01_000003_create_pegawai_profils_table', 1),
	(7, '2024_01_01_000004_create_face_embeddings_table', 1),
	(8, '2024_01_01_000005_create_shifts_table', 1),
	(9, '2024_01_01_000006_create_jadwal_shifts_table', 1),
	(10, '2024_01_01_000007_create_presensis_table', 1),
	(11, '2024_01_01_000008_create_pengajuan_izins_table', 1),
	(12, '2024_01_01_000009_add_lembur_menit_to_presensis_table', 1),
	(13, '2024_01_01_000010_add_jenis_perangkat_to_presensis_table', 1),
	(14, '2024_01_01_000011_rename_cafe_settings_to_cabangs', 1),
	(15, '2024_01_01_000012_add_cabang_id_to_pegawai_profils_table', 1),
	(16, '2024_01_01_000013_change_device_type_to_string_in_presensis_table', 1),
	(17, '2024_01_01_000014_create_bisnis_table', 1),
	(18, '2024_01_01_000015_add_bisnis_id_to_tables', 1),
	(19, '2026_07_30_112358_create_personal_access_tokens_table', 1),
	(20, '2024_01_01_000016_create_paket_langganan_tables', 2),
	(21, '2024_01_01_000017_ubah_paket_jadi_starter_pro_business', 3),
	(22, '2024_01_01_000018_add_midtrans_dan_reminder_langganan', 3);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.paket
CREATE TABLE IF NOT EXISTS `paket` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `harga_bulanan` int(10) unsigned NOT NULL,
  `harga_tahunan` int(10) unsigned NOT NULL,
  `max_cabang` int(10) unsigned DEFAULT NULL,
  `max_pegawai` int(10) unsigned DEFAULT NULL,
  `fitur` json NOT NULL,
  `urutan` smallint(5) unsigned NOT NULL DEFAULT '0',
  `is_populer` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paket_kode_unique` (`kode`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.paket: ~3 rows (approximately)
/*!40000 ALTER TABLE `paket` DISABLE KEYS */;
INSERT INTO `paket` (`id`, `kode`, `nama`, `deskripsi`, `harga_bulanan`, `harga_tahunan`, `max_cabang`, `max_pegawai`, `fitur`, `urutan`, `is_populer`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'starter', 'Starter', 'Uji coba gratis 14 hari. Setelah itu akun nonaktif sampai berlangganan.', 0, 0, 1, 10, '["izin", "kiosk"]', 1, 0, 1, '2026-10-30 10:26:51', '2026-10-31 13:38:14'),
	(2, 'pro', 'Pro', 'Untuk cafe berkembang: kiosk tablet, lembur otomatis, beberapa cabang.', 299000, 2990000, 3, 50, '["izin", "kiosk", "lembur"]', 2, 1, 1, '2026-10-30 10:26:51', '2026-10-30 10:26:51'),
	(3, 'business', 'Business', 'Untuk jaringan cafe dengan banyak cabang dan pegawai.', 599000, 5990000, 10, 200, '["izin", "kiosk", "lembur"]', 3, 0, 1, '2026-10-30 10:26:51', '2026-10-30 10:26:51');
/*!40000 ALTER TABLE `paket` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.password_reset_tokens: ~0 rows (approximately)
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.pegawai_profils
CREATE TABLE IF NOT EXISTS `pegawai_profils` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `cabang_id` bigint(20) unsigned DEFAULT NULL,
  `kode_pegawai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jabatan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telepon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `tanggal_bergabung` date DEFAULT NULL,
  `foto_profil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pegawai_profils_kode_pegawai_unique` (`kode_pegawai`),
  KEY `pegawai_profils_user_id_foreign` (`user_id`),
  KEY `pegawai_profils_cabang_id_foreign` (`cabang_id`),
  CONSTRAINT `pegawai_profils_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabangs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pegawai_profils_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.pegawai_profils: ~4 rows (approximately)
/*!40000 ALTER TABLE `pegawai_profils` DISABLE KEYS */;
INSERT INTO `pegawai_profils` (`id`, `user_id`, `cabang_id`, `kode_pegawai`, `jabatan`, `no_telepon`, `alamat`, `tanggal_bergabung`, `foto_profil`, `status_aktif`, `created_at`, `updated_at`) VALUES
	(1, 3, 1, 'EMP-0001', 'Waiters', '08921242131', NULL, '2026-08-20', NULL, 1, '2026-08-20 14:41:35', '2026-08-20 14:41:35'),
	(2, 4, 1, 'EMP-0002', 'Kasir', '08214213123', NULL, '2026-08-20', NULL, 1, '2026-08-20 14:42:35', '2026-08-20 14:42:35'),
	(3, 6, 2, 'EMP-0003', 'Kasir', '082132112321', NULL, '2026-08-30', NULL, 1, '2026-08-30 13:29:34', '2026-08-30 13:29:34'),
	(4, 7, 2, 'EMP-0004', 'Barista', '0895165012121', NULL, '2026-08-30', NULL, 1, '2026-08-30 13:30:31', '2026-08-30 13:30:31');
/*!40000 ALTER TABLE `pegawai_profils` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.pembayaran_langganans
CREATE TABLE IF NOT EXISTS `pembayaran_langganans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bisnis_id` bigint(20) unsigned NOT NULL,
  `paket_id` bigint(20) unsigned NOT NULL,
  `siklus` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'transfer',
  `jumlah_dasar` int(10) unsigned NOT NULL,
  `kode_unik` smallint(5) unsigned NOT NULL DEFAULT '0',
  `jumlah_total` int(10) unsigned NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menunggu_pembayaran',
  `midtrans_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_payment_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bukti_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_pengirim` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_pengirim` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dibayar_at` datetime DEFAULT NULL,
  `dikonfirmasi_at` datetime DEFAULT NULL,
  `dikonfirmasi_oleh` bigint(20) unsigned DEFAULT NULL,
  `alasan_tolak` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pembayaran_langganans_midtrans_order_id_unique` (`midtrans_order_id`),
  KEY `pembayaran_langganans_paket_id_foreign` (`paket_id`),
  KEY `pembayaran_langganans_dikonfirmasi_oleh_foreign` (`dikonfirmasi_oleh`),
  KEY `pembayaran_langganans_bisnis_id_status_index` (`bisnis_id`,`status`),
  CONSTRAINT `pembayaran_langganans_bisnis_id_foreign` FOREIGN KEY (`bisnis_id`) REFERENCES `bisnis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pembayaran_langganans_dikonfirmasi_oleh_foreign` FOREIGN KEY (`dikonfirmasi_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pembayaran_langganans_paket_id_foreign` FOREIGN KEY (`paket_id`) REFERENCES `paket` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.pembayaran_langganans: ~0 rows (approximately)
/*!40000 ALTER TABLE `pembayaran_langganans` DISABLE KEYS */;
INSERT INTO `pembayaran_langganans` (`id`, `bisnis_id`, `paket_id`, `siklus`, `metode`, `jumlah_dasar`, `kode_unik`, `jumlah_total`, `status`, `midtrans_order_id`, `snap_token`, `midtrans_transaction_id`, `midtrans_payment_type`, `bukti_path`, `nama_pengirim`, `bank_pengirim`, `dibayar_at`, `dikonfirmasi_at`, `dikonfirmasi_oleh`, `alasan_tolak`, `created_at`, `updated_at`) VALUES
	(1, 1, 2, 'bulanan', 'transfer', 299000, 695, 299695, 'menunggu_pembayaran', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-01 08:50:28', '2026-11-01 08:50:28');
/*!40000 ALTER TABLE `pembayaran_langganans` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.pengajuan_izins
CREATE TABLE IF NOT EXISTS `pengajuan_izins` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pegawai_profil_id` bigint(20) unsigned NOT NULL,
  `jenis` enum('izin','sakit','cuti') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `alasan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bukti_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','disetujui','ditolak') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `catatan_admin` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pengajuan_izins_pegawai_profil_id_foreign` (`pegawai_profil_id`),
  KEY `pengajuan_izins_approved_by_foreign` (`approved_by`),
  CONSTRAINT `pengajuan_izins_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pengajuan_izins_pegawai_profil_id_foreign` FOREIGN KEY (`pegawai_profil_id`) REFERENCES `pegawai_profils` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.pengajuan_izins: ~0 rows (approximately)
/*!40000 ALTER TABLE `pengajuan_izins` DISABLE KEYS */;
/*!40000 ALTER TABLE `pengajuan_izins` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.personal_access_tokens: ~3 rows (approximately)
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
	(1, 'App\\Models\\User', 1, 'auth-token', '948c9ccdc9f31d24b4d396e71d8d1ef2c41c4179085f886e0f4aa0b72329b7fc', '["*"]', NULL, NULL, '2026-10-30 10:41:10', '2026-10-30 10:41:10'),
	(5, 'App\\Models\\User', 1, 'auth-token', '1de1ba4cafc670763ad814a9866b639a438cea319a6dd6b3e6ec09bb1625608b', '["*"]', '2026-10-30 10:46:38', NULL, '2026-10-30 10:46:22', '2026-10-30 10:46:38'),
	(8, 'App\\Models\\User', 2, 'auth-token', 'fcd4b1a62764d4e993ee7c7315f072f960b91a9da1c33bced31cdff0cae48576', '["*"]', '2026-10-30 15:54:10', NULL, '2026-10-30 15:53:07', '2026-10-30 15:54:10');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.presensis
CREATE TABLE IF NOT EXISTS `presensis` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pegawai_profil_id` bigint(20) unsigned NOT NULL,
  `jadwal_shift_id` bigint(20) unsigned DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` datetime DEFAULT NULL,
  `device_type_masuk` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_perangkat_masuk` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude_masuk` decimal(10,7) DEFAULT NULL,
  `longitude_masuk` decimal(10,7) DEFAULT NULL,
  `foto_bukti_masuk` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confidence_score_masuk` decimal(5,2) DEFAULT NULL,
  `jam_pulang` datetime DEFAULT NULL,
  `device_type_pulang` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_perangkat_pulang` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude_pulang` decimal(10,7) DEFAULT NULL,
  `longitude_pulang` decimal(10,7) DEFAULT NULL,
  `foto_bukti_pulang` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confidence_score_pulang` decimal(5,2) DEFAULT NULL,
  `status` enum('tepat_waktu','terlambat','pulang_cepat','tidak_hadir','izin','sakit','cuti') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tepat_waktu',
  `lembur_menit` int(10) unsigned DEFAULT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `presensis_pegawai_profil_id_tanggal_unique` (`pegawai_profil_id`,`tanggal`),
  KEY `presensis_jadwal_shift_id_foreign` (`jadwal_shift_id`),
  CONSTRAINT `presensis_jadwal_shift_id_foreign` FOREIGN KEY (`jadwal_shift_id`) REFERENCES `jadwal_shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `presensis_pegawai_profil_id_foreign` FOREIGN KEY (`pegawai_profil_id`) REFERENCES `pegawai_profils` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.presensis: ~0 rows (approximately)
/*!40000 ALTER TABLE `presensis` DISABLE KEYS */;
INSERT INTO `presensis` (`id`, `pegawai_profil_id`, `jadwal_shift_id`, `tanggal`, `jam_masuk`, `device_type_masuk`, `jenis_perangkat_masuk`, `latitude_masuk`, `longitude_masuk`, `foto_bukti_masuk`, `confidence_score_masuk`, `jam_pulang`, `device_type_pulang`, `jenis_perangkat_pulang`, `latitude_pulang`, `longitude_pulang`, `foto_bukti_pulang`, `confidence_score_pulang`, `status`, `lembur_menit`, `catatan`, `created_at`, `updated_at`) VALUES
	(5, 1, NULL, '2026-08-25', '2026-08-25 14:32:29', 'kiosk', 'desktop', NULL, NULL, 'bukti-presensi/9a1CPo50aMHCwdBcRzJm4HVm4sFcuXy02VrzQYzP.jpg', 79.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'tepat_waktu', NULL, NULL, '2026-08-25 14:32:29', '2026-08-25 14:32:29');
/*!40000 ALTER TABLE `presensis` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.sessions: ~1 rows (approximately)
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('4Y0lizjivZaB9hGcCYWMb3MxjuNytaUHPVFhePyP', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 OPR/138.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicll5aHRFT1FVUXgzTmJPc1dubFdkdk5jd293M2RsZVJOcms3TWsyTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1793453808),
	('HO1jadMHOtxqSzqnsWKIC3g0AqNFeRPE4azTu2Nr', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 OPR/138.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiY0JienNEVUlkUXEySmdTM1J1TXlWTWY2Q2FQWWRBb1kydExTRkNFdiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1793453813);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.shifts
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bisnis_id` bigint(20) unsigned DEFAULT NULL,
  `nama_shift` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `toleransi_telat_menit` int(10) unsigned NOT NULL DEFAULT '15',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shifts_bisnis_id_foreign` (`bisnis_id`),
  CONSTRAINT `shifts_bisnis_id_foreign` FOREIGN KEY (`bisnis_id`) REFERENCES `bisnis` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.shifts: ~2 rows (approximately)
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` (`id`, `bisnis_id`, `nama_shift`, `jam_mulai`, `jam_selesai`, `toleransi_telat_menit`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Shift Pagi', '08:00:00', '16:00:00', 15, 1, '2026-08-20 10:44:43', '2026-08-20 10:44:43'),
	(2, 1, 'Shift Malam', '21:00:00', '23:00:00', 15, 1, '2026-08-20 10:44:43', '2026-08-25 14:06:12');
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;

-- Dumping structure for table presensi_cafe.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bisnis_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pegawai',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_bisnis_id_foreign` (`bisnis_id`),
  CONSTRAINT `users_bisnis_id_foreign` FOREIGN KEY (`bisnis_id`) REFERENCES `bisnis` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table presensi_cafe.users: ~6 rows (approximately)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `bisnis_id`, `name`, `email`, `role`, `is_active`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
	(1, NULL, 'Super Admin', 'superadmin@presensi.com', 'super_admin', 1, NULL, '$2y$12$3MYjPV62ChwmL8Vsar/ugOVl7sR4KRSYbGN0hBja6STeq3qSy3huG', NULL, '2026-08-20 10:44:42', '2026-10-30 10:29:17'),
	(2, 1, 'Admin Cafe', 'admin@cafe.com', 'admin', 1, NULL, '$2y$12$EE6cCpx5T4Nq3E0A0ngX1OxtMYoKVoUylQYcuEg8MCDC8jzbkMmRK', NULL, '2026-08-20 10:44:43', '2026-10-30 09:18:07'),
	(3, 1, 'Rizki', 'riski@sarma.com', 'pegawai', 1, NULL, '$2y$12$2mA.Z.HiZo7hQkvEZJC71ulBvLWv66qhuIqHJkcjXZkWFfph91D8a', NULL, '2026-08-20 14:41:35', '2026-08-20 14:41:35'),
	(4, 1, 'yanto', 'yanto@gmail.com', 'pegawai', 1, NULL, '$2y$12$80yRG9kVxYObG5TvLj03relQKOqmmQtvdHZWZ6aLyb9YZvB0RuSn.', NULL, '2026-08-20 14:42:35', '2026-08-20 14:42:35'),
	(5, 2, 'sarma', 'sarma@gmail.com', 'admin', 1, NULL, '$2y$12$/0Dqa.PkvUt5fFQCz9N2teesXF0NSAmySDsgN9LKFl8B8ujzdwmF.', NULL, '2026-08-30 13:23:42', '2026-08-30 13:23:42'),
	(6, 2, 'Israk', 'israk@gmail.com', 'pegawai', 1, NULL, '$2y$12$9ZHXOTDmssi3kkc6HUk97e53SABkHTwNRLc3W5LwKPfgCh9wDjvHW', NULL, '2026-08-30 13:29:34', '2026-08-30 13:29:34'),
	(7, 2, 'Farhan Y', 'farhan@gmail.com', 'pegawai', 1, NULL, '$2y$12$1rqK2GCCZgDu16Q/l2FEwe10rh5i2ySyEcHuTqCq6pIWUjZh8ZGcK', NULL, '2026-08-30 13:30:31', '2026-08-30 13:30:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
