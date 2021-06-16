FROM python:3.8

RUN pip install boto3 requests

COPY ./iam_role.json ./
COPY ./setup_localstack.py ./

CMD [ "python", "./setup_localstack.py" ]
