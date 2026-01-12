---
description: High-level overview of the Registry
keywords: registry, on-prem, images, tags, repository, distribution
title: Distribution Registry
---

## What it is

The Registry is a stateless, highly scalable server side application that stores
and lets you distribute container images and other content. The Registry is open-source, under the
permissive [Apache license](https://en.wikipedia.org/wiki/Apache_License).

## Why use it

You should use the Registry if you want to:

 * tightly control where your images are being stored
 * fully own your images distribution pipeline
 * integrate image storage and distribution tightly into your in-house development workflow

## Alternatives

### Hosted Registry Services

Users looking for a zero maintenance, ready-to-go solution are encouraged to
use one of the existing registry services. Many of these provide support and security
scanning, and are free for public repositories. For example:
- [Docker Hub](https://hub.docker.com)
- [Quay.io](https://quay.io/)
- [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

Cloud infrastructure providers such as [AWS](https://aws.amazon.com/ecr/), [Azure](https://azure.microsoft.com/products/container-registry/), [Google Cloud](https://cloud.google.com/artifact-registry) and [IBM Cloud](https://www.ibm.com/products/container-registry) also have container registry services available at a cost.

### Self-Hosted Alternatives

If you're looking for other lightweight, self-hosted container registry solutions, consider:

- **[Harbor](https://goharbor.io/)** - An open source trusted cloud native registry project that stores, signs, and scans content. Harbor is built on top of Distribution and adds enterprise features like security scanning, role-based access control, and image replication. It's a CNCF graduated project suitable for organizations needing advanced security and management features.

- **[Zot](https://zotregistry.io/)** - A production-ready, vendor-neutral OCI image registry with minimal dependencies, written in Go. Designed to be simple, secure, and standards-compliant with low resource requirements (can run with <100MB memory), making it ideal for edge, IoT, and resource-constrained environments. Like Distribution, it's a lightweight registry, but Zot focuses on simplicity and includes built-in security features like image signing verification and access control.

- **[Gitea Container Registry](https://docs.gitea.io/en-us/packages/container/)** - A lightweight package registry integrated into Gitea, supporting container images alongside other package formats. Ideal for small teams already using Gitea who want unified source code and container management.

- **[Nexus Repository](https://www.sonatype.com/products/nexus-repository)** - A universal artifact repository manager that supports Docker registries among many other formats. Available in both OSS and Pro versions. Better suited for organizations with diverse artifact types beyond containers.

- **[JFrog Artifactory](https://jfrog.com/artifactory/)** - A comprehensive universal artifact repository that includes Docker registry capabilities, available in both self-hosted and cloud versions. Enterprise-focused with extensive features but higher resource requirements.

- **[Dragonfly](https://d7y.io/)** - A CNCF-hosted P2P-based image and file distribution system that accelerates content delivery from existing registries (including Distribution). It works as a distribution layer rather than a replacement registry, improving efficiency for large-scale deployments.

#### When choosing an alternative, consider:

- **Most lightweight**: Distribution and Zot are suitable for environments with limited resources
- **Security-focused**: Harbor adds enterprise security features on top of Distribution
- **Integrated workflow**: Gitea is ideal if you need unified source code and container management
- **Multi-format needs**: Nexus and Artifactory are better for organizations managing diverse artifact types, but require more resources

## Compatibility

The distribution registry implements the [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec) version 1.0.1.

## Basic commands

Start your registry

```sh
docker run -d -p 5000:5000 --name registry registry:3
```

Pull (or build) some image from the hub

```sh
docker pull ubuntu
```

Tag the image so that it points to your registry

```sh
docker image tag ubuntu localhost:5000/myfirstimage
```

Push it

```sh
docker push localhost:5000/myfirstimage
```

Pull it back

```sh
docker pull localhost:5000/myfirstimage
```

Now stop your registry and remove all data

```sh
docker container stop registry && docker container rm -v registry
```

## Next

You should now read the [detailed introduction about the registry](about),
or jump directly to [deployment instructions](about/deploying).
