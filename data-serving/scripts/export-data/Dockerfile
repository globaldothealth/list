FROM alpine:3.14

RUN apk update
RUN apk add bash mongodb-tools python3 aws-cli

ARG CONN
ENV CONN=${CONN}
COPY country_export.sh .
COPY transform.py .
COPY fields.txt .
ENTRYPOINT ["./country_export.sh"]
