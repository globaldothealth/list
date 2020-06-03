# Production infrastructure

This directory contains the configuration files for the production infrastructure of the epid project.

## One-time setup

Install `eksctl` and `kubectl` to interact with Amazon EKS and the Kubernetes control plane.

You can learn more about `eksctl` [here](https://eksctl.io/).

To configure kubectl to talk to the healthmapidha cluster, do:

```shell
aws eks --region us-east-1 update-kubeconfig --name healthmapidha
```

## Kubernetes setup

Our cluster can be seen on the [AWS console](https://console.aws.amazon.com/eks/home?region=us-east-1#/clusters) but that console is pretty much useless as it shows no information on the cluster nodes.

You can also list them with `eksctl get cluster`.

The cluster was originally created with the command:

```shell
eksctl create cluster --name=healthmapidha --region=us-east-1 --fargate --version=1.16
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
curator-dev    NodePort    10.100.116.43    <none>        80:32119/TCP   4d21h
curator-prod   NodePort    10.100.66.95     <none>        80:32085/TCP   4d21h
data-dev       ClusterIP   10.100.108.137   <none>        80/TCP         4d22h
data-prod      ClusterIP   10.100.71.150    <none>        80/TCP         4d22h
kubernetes     ClusterIP   10.100.0.1       <none>        443/TCP        4d22h

kubectl get ingress
NAME           HOSTS   ADDRESS                                                                  PORTS   AGE
curator-dev    *       51cfaa79-default-curatorde-771d-764651811.us-east-1.elb.amazonaws.com    80      3h18m
curator-prod   *       51cfaa79-default-curatorpr-5c7d-1665373250.us-east-1.elb.amazonaws.com   80      121m
```


We use a deployment file for the data-service and for the curator-service, check out data.yaml and curator.yaml.

To update the deployments use:

```shell
kubectl apply -f data.yaml -f curator.yaml
```

### Addressing

The EKS cluster has kube-dns running by default which enables pods to talk together easily.

Data and curator are exposed as kubernetes services inside the cluster (but have no external IP yet until we enable authorization on data CRUD).

TODO: Enable LoadBalancer service in curator.yaml

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

## Ingress / Application load balancer

Curator services are exposed here:

- [dev](http://51cfaa79-default-curatorde-771d-764651811.us-east-1.elb.amazonaws.com/)
- [prod](http://51cfaa79-default-curatorpr-5c7d-1665373250.us-east-1.elb.amazonaws.com)

TODO: Apply `external-dns` to configs once we know where we'll run those.

TODO: Map port 443 in ingress configs for HTTPS support.

This section unfortunately involves quite a few sequential command-line executions for properly setting-up IAM.

The setup was done following a mix of articles:

- https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html
- https://aws.amazon.com/premiumsupport/knowledge-center/eks-alb-ingress-controller-fargate/
- https://kubernetes-sigs.github.io/aws-alb-ingress-controller/guide/walkthrough/echoserver/
- https://aws.amazon.com/blogs/containers/using-alb-ingress-controller-with-amazon-eks-on-fargate/


A one-time set-up is required the first time you create an ALB on the cluster:

```shell
$ eksctl utils associate-iam-oidc-provider \
    --region us-east-1 \
    --cluster healthmapidha \
    --approve
[ℹ]  eksctl version 0.19.0
[ℹ]  using region us-east-1
[ℹ]  will create IAM Open ID Connect provider for cluster "healthmapidha" in "us-east-1"
[✔]  created IAM Open ID Connect provider for cluster "healthmapidha" in "us-east-1"
```

```shell
$ kubectl apply -f rbac-role.yaml
clusterrole.rbac.authorization.k8s.io/alb-ingress-controller created
clusterrolebinding.rbac.authorization.k8s.io/alb-ingress-controller created
serviceaccount/alb-ingress-controller created
```

```shell
curl -o alb-ingress-iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/iam-policy.json
aws iam create-policy --policy-name ALBIngressControllerIAMPolicy --policy-document file://alb-ingress-iam-policy.json
```

Output looks like:
```json
{
    "Policy": {
        "PolicyName": "ALBIngressControllerIAMPolicy",
        "PolicyId": "ANPAY5MYD7EJNLANRK5BI",
        "Arn": "arn:aws:iam::612888738066:policy/ALBIngressControllerIAMPolicy",
        "Path": "/",
        "DefaultVersionId": "v1",
        "AttachmentCount": 0,
        "PermissionsBoundaryUsageCount": 0,
        "IsAttachable": true,
        "CreateDate": "2020-06-02T08:36:54+00:00",
        "UpdateDate": "2020-06-02T08:36:54+00:00"
    }
}
```

The ALB needs to run with its own service account, to create one do:

```shell
CLUSTER_NAME=healthmapidha
STACK_NAME=eksctl-$CLUSTER_NAME-cluster
VPC_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" | jq -r '[.Stacks[0].Outputs[] | {key: .OutputKey, value: .OutputValue}] | from_entries' | jq -r '.VPC')
AWS_ACCOUNT_ID=$(aws sts get-caller-identity | jq -r '.Account')
eksctl create iamserviceaccount \
--name alb-ingress-controller \
--namespace kube-system \
--cluster $CLUSTER_NAME \
--attach-policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/ALBIngressControllerIAMPolicy \
--approve \
--override-existing-serviceaccounts
```

We created our cluster with eksctl so the subnets are automatically tagged correctly for auto-discovery by the ALB controller.

You can now run the controller and setup the ingresses:

```
kubectl apply -f alb-ingress.controller.yaml -f curator-ingress.yaml
```