ci:
	docker run --rm -v $(PWD):/app node:14-alpine sh -c "cd /app && npm ci"

seed:
	@echo "Use something like:"
	@echo "docker exec -i pickahit-mongo sh -c \"mongorestore --drop --archive\" < ~/backups/pickahit/pickahit.dump"
