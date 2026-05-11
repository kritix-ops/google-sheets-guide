CREATE TABLE `lesson_draft` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track` text NOT NULL,
	`slug` text NOT NULL,
	`lang` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`published_at` integer,
	`published_commit` text,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
