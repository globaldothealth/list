FROM alpine:3.14

RUN apk update
RUN apk add bash mongodb-tools python3 aws-cli

COPY common.sh .
COPY country_export.sh .
COPY logger.py .
COPY transform.py .
COPY fields.txt .
ENTRYPOINT ["./country_export.sh"]
