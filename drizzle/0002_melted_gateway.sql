CREATE TABLE `admin_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` text,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `allowed_user` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`added_by` text,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`note` text,
	FOREIGN KEY (`added_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
