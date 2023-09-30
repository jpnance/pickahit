ci:
	docker run --rm -v $(PWD):/app node:14-alpine sh -c "cd /app && npm ci"

seed:
	@echo "Use something like:"
	@echo "docker exec -i pickahit-mongo sh -c \"mongorestore --drop --archive\" < ~/backups/pickahit/pickahit.dump"

schedule:
	docker exec pickahit-cron sh -c "cd /app/bin && node schedule.js"

games:
	docker exec pickahit-cron sh -c "cd /app/bin && node games.js"

players:
	docker exec pickahit-cron sh -c "cd /app/bin && node players.js"

reset:
	docker exec pickahit-cron sh -c "cd /app/bin && node reset.js"
