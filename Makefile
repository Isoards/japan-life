IMAGE ?= isoards/japan-life
TAG ?= $(shell date +%m%d)
PLATFORM ?= linux/amd64
BUILDER ?= multiarch-builder

.PHONY: ensure-buildx docker-push-date docker-push-multi

ensure-buildx:
	@docker buildx inspect $(BUILDER) >/dev/null 2>&1 || docker buildx create --name $(BUILDER) --use
	@docker buildx use $(BUILDER)
	@docker buildx inspect --bootstrap >/dev/null

docker-push-date: ensure-buildx
	@echo "Pushing $(IMAGE):$(TAG) ($(PLATFORM))"
	@docker buildx build \
		--platform $(PLATFORM) \
		-t $(IMAGE):$(TAG) \
		-t $(IMAGE):latest \
		--push .
	@docker buildx imagetools inspect $(IMAGE):$(TAG)

docker-push-multi: ensure-buildx
	@echo "Pushing $(IMAGE):$(TAG) (linux/amd64,linux/arm64)"
	@docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(IMAGE):$(TAG) \
		-t $(IMAGE):latest \
		--push .
	@docker buildx imagetools inspect $(IMAGE):$(TAG)
