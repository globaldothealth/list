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
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
curator   2/2     2            2           79m
data      2/2     2            2           117m

kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
curator-58969b66f4-f6cps   1/1     Running   0          18m
curator-58969b66f4-vhtqz   1/1     Running   0          14m
data-6d699fcbcc-jbg4j      1/1     Running   0          102m
data-6d699fcbcc-tc2fm      1/1     Running   0          26m

kubectl get services
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
curator      ClusterIP   10.100.15.14    <none>        80/TCP     40m
data         ClusterIP   10.100.105.54   <none>        80/TCP     21m
kubernetes   ClusterIP   10.100.0.1      <none>        443/TCP    86m
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

Automated builds create a new image with the _latest_ tag upon every push to the master branch on this github repo.