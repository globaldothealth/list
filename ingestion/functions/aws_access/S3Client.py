import boto3

class S3Client:
    def __init__(self, region, endpoint_url=None):
        """
        Create an S3 client for the specified AWS region.
        Optionally pass the AWS endpoint URL, e.g. to test with localstack.
        """
        self.s3_adapter = boto3.resource('s3', endpoint_url=endpoint_url, region_name=region)
    
    def objects_in_bucket_for_ingestion_source(self, bucket_name, source_id):
        """
        Lists all of the ingestion source objects for a given source in the sources bucket.
        Relies on the convention that files are named source_id/date/filename.ext
        Returns an iterator containing all of the matching objects
        """
        bucket = self.s3_adapter.Bucket(bucket_name)
        objects = bucket.objects.filter(Prefix = source_id)
        return objects

    def delete_object_in_bucket(self, bucket_name, file_name):
        """
        Deletes the given object from the bucket.
        Note that S3 is not hierarchical, so file_name is the "full path" to the object.
        """
        self.s3_adapter.Bucket(bucket_name).delete_objects(Delete={'Objects':[{'Key': file_name}]})

