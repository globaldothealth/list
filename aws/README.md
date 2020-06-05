# Production infrastructure

This directory contains the configuration files for the production infrastructure of the epid project.

## One-time setup

Install `eksctl` and `kubectl` to interact with Amazon EKS and the Kubernetes control plane.

You can learn more about `eksctl` [here](https://eksctl.io/).

To configure kubectl to talk to the ghdsi cluster, do:

```shell
aws eks --region us-east-1 update-kubeconfig --name ghdsi
```

## Kubernetes setup

Our cluster can be seen on the [AWS console](https://console.aws.amazon.com/eks/home?region=us-east-1#/clusters) but that console is pretty much useless as it shows no information on the cluster nodes.

You can also list them with `eksctl get cluster`.

The cluster was originally created with the command:

```shell
eksctl create cluster -f cluster.yaml
```

The basic deployment/pods/services configuration looks like:

```
kubectl get deployments
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
curator-dev    1/1     1            1           19h
curator-prod   1/1     1            1           19h
data-dev       1/1     1            1           19h
data-prod      1/1     1            1           19h

kubectl get pods
NAME                           READY   STATUS    RESTARTS   AGE
curator-dev-69d6f94954-qrc2v   1/1     Running   0          14m
curator-prod-dfb49646-qz5zp    1/1     Running   0          14m
data-dev-6f686ffdb6-jt6tl      1/1     Running   0          14m
data-prod-bd57576d8-p8wp4      1/1     Running   0          14m

kubectl get services
NAME           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
curator-dev    ClusterIP   10.100.222.22    <none>        80/TCP    110m
curator-prod   ClusterIP   10.100.43.67     <none>        80/TCP    3h7m
data-dev       ClusterIP   10.100.204.152   <none>        80/TCP    3h7m
data-prod      ClusterIP   10.100.59.189    <none>        80/TCP    3h7m
kubernetes     ClusterIP   10.100.0.1       <none>        443/TCP   3h25m

kubectl get ingress
kubectl get ingress
NAME                        HOSTS                                     ADDRESS                                                                         PORTS     AGE
cm-acme-http-solver-k9bzb   curator.ghdsi.org                         ad9f94057436541e5a5d6b4f9b2deec0-1e4e71b2092ca07c.elb.us-east-1.amazonaws.com   80        31s
cm-acme-http-solver-mvg2s   dev-curator.ghdsi.org                     ad9f94057436541e5a5d6b4f9b2deec0-1e4e71b2092ca07c.elb.us-east-1.amazonaws.com   80        31s
curator                     dev-curator.ghdsi.org,curator.ghdsi.org   ad9f94057436541e5a5d6b4f9b2deec0-1e4e71b2092ca07c.elb.us-east-1.amazonaws.com   80, 443   34s
```

We use a deployment file for the data service and for the curator service, check out `data.yaml` and `curator.yaml`.

To update the deployments use:

```shell
kubectl apply -f data.yaml -f curator.yaml
```

### Addressing

The EKS cluster has kube-dns running by default which enables pods to talk together easily.

Data and curator are exposed as kubernetes services inside the cluster (but have no external IP yet until we enable authorization on data CRUD).

You can check DNS resolution within the cluster by running:

```
kubectl run curl --image=radial/busyboxplus:curl -i --tty
[ root@curl:/ ]$ nslookup curator
Server:    10.100.0.10
Address 1: 10.100.0.10 kube-dns.kube-system.svc.cluster.local

Name:      curator
Address 1: 10.100.15.14 curator.default.svc.cluster.local
```

Once you're done with it, don't forget to delete the pod: `kubectl delete pod curl`.

### Secrets

Deployments require secrets to connect to MongoDB for example or set up OAuth, we are using kubernetes-managed secrets via kustomize to generate secrets and reference them in the deployment files.

When you want to generate a new secret, follow the [official instructions](https://kubernetes.io/docs/concepts/configuration/secret/) using a kustomization.yaml file that looks like this:

```yaml
secretGenerator:
  - name: data-dev
    literals:
      - some_secret_for_data=foo
  - name: curator-dev
    literals:
      - some_secret_for_curator=bar
      - another_secret_for_curator=baz
  - name: data-prod
    literals:
      - some_secret_for_data=foo
  - name: curator-prod
    literals:
      - some_secret_for_curator=foo
      - another_secret_for_curator=baz
```

Apply with `kubectl apply -k .`.

If you generated a new secret, you need to set it in the appropriate deployment files.

To get a list of existing secrets, you can do `kubectl get secrets`.

## Labels

We use labels to differentiate between prod and dev instances of the containers.

Curator service has the labels `app=curator` and `environment=prod|dev`.

Data service has the labels `app=data` and `environment=prod|dev`.

Services exposed contain the environment in their names to avoid mistakenly taking to a different service, for example use `http://data-dev` to talk to dev data service and `http://data-prod` to talk to the prod data service.

## Docker-hub

Images used in deployments are pulled from docker hub where automated builds have been set-up.

Check out the repos for the [curator service](https://hub.docker.com/repository/docker/healthmapidha/curatorservice) and [data service](https://hub.docker.com/repository/docker/healthmapidha/dataservice).

Automated builds create a new image with the _latest_ tag upon every push to the master branch on this github repo. More specialized tags are described below.

## Releases

We follow [semantic versioning](https://semver.org/) which is basically:

    Given a version number MAJOR.MINOR.PATCH, increment the:

    MAJOR version when you make incompatible API changes,
    MINOR version when you add functionality in a backwards compatible manner, and
    PATCH version when you make backwards compatible bug fixes.

Docker-hub has automated builds setup that extract the semantic version from tags in the master branch.

To push a new release of the curator service:

Tag master with the `curator-0.1.2` tag:

`git tag curator-0.1.2`

the push it to the repo:

`git push origin curator-0.1.2`

Docker hub will automatically build the image: `docker.io/healthmapidha/curatorservice:0.1.2`.

This tag can then be referenced in the deployment files, change the current image version to the new one and apply the change: `kubectl apply -f curator.yaml`.

To push a new release of the data service, follow the same procedure but change `curator` to `data` in the tag.

You can list the existing tags/versions with `git tag` or on the [github repo](https://github.com/open-covid-data/healthmap-gdo-temp/releases).

### `Latest` image tag for dev

Dev instances of curator and data services are using the `latest` image tag, that's not best practice but is okay while we work on other features. The latest image is fetched when a deployment is updated, to update dev to the `latest` image built by docker-hub, do:

```shell
kubectl rollout restart deployment/curator-dev
kubectl rollout restart deployment/data-dev
```

### Rollback

Just change the image tag referenced in the deployment file to an earlier version and apply the change.

### Deleting a release

If for some reason you need to delete a tag, you can do it with `git tag -d curator-1.2.3` then `git push origin :refs/tags/curator-0.1.2` to delete it remotely.

## Metric server

Metric server was installed in the custer:

```shell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml
```

It allows getting real-time resource usage of pods and nodes using `kubectl top node` and `kubectl top pod`.

## Ingress / Application load balancer

We use the kubernetes-maintained nginx ingress controller, it was installed with:

```shell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/aws/deploy.yaml
```

Our ingress routes to the dev and prod curator services were installed with:

```shell
kubectl apply -f curator-ingress.yaml
```

The curator services are exposed here:

- [dev](https://dev-curator.ghdsi.org)
- [prod](https://curator.ghdsi.org)

## HTTPS / certs management

Certificates are managed automatically by [certs manager](https://cert-manager.io).

It was installed with:

```shell
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v0.15.1/cert-manager.yaml
```

Note: Cert manager pods run in the `cert-manager` namespace.

We are using let's encrypt as an issuing authority:

```shell
kubectl apply -f letsencrypt.yaml
```

The nginx ingress is annotated with the corresponding `cert-manager.io/issuer` annotation so that certs are automatically requested for the hosts specified in the ingress config.