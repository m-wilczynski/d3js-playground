using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading;
using Microsoft.AspNetCore.Mvc;

namespace LiveAreaChartExample.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthChecksController : ControllerBase
    {
        private static readonly Random Random = new Random();

        private static ImmutableList<ApplicationDefinitionViewModel> _applications = new List<ApplicationDefinitionViewModel>
        {
            new ApplicationDefinitionViewModel { Id = 1, Name = "My Application #1" },
            new ApplicationDefinitionViewModel { Id = 2, Name = "My Application #2" }
        }.ToImmutableList();

        private static readonly ImmutableDictionary<int, ConcurrentBag<HealthCheckViewModel>> _healthChecksByApplicationId =
            _applications.ToImmutableDictionary(_ => _.Id, _ => new ConcurrentBag<HealthCheckViewModel>());

        static HealthChecksController()
        {
            //Imitate background healthcheck collection
            new Thread(_ =>
            {
                while (true)
                {
                    foreach (var kvp in _healthChecksByApplicationId)
                    {
                        var applicationId = kvp.Key;
                        var applicationHealtcheks = kvp.Value;

                        //Self-cleanup for demo deployment
                        if (applicationHealtcheks.Count > 1800)
                        {
                            for (var i = 0; i < 6; i++) { applicationHealtcheks.TryTake(out var whatever); }
                        }

                        var now = DateTime.Now;

                        var healthchecks = new List<HealthCheckViewModel>
                        {
                            new HealthCheckViewModel
                            {
                                Name = "Database",
                                ApplicationId = 1,
                                MachineName = "machine01",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            },
                            new HealthCheckViewModel
                            {
                                Name = "Queue",
                                ApplicationId = 1,
                                MachineName = "machine01",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            },
                            new HealthCheckViewModel
                            {
                                Name = "Other service",
                                ApplicationId = 1,
                                MachineName = "machine01",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            },
                            new HealthCheckViewModel
                            {
                                Name = "Database",
                                ApplicationId = 1,
                                MachineName = "machine02",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            },
                            new HealthCheckViewModel
                            {
                                Name = "Queue",
                                ApplicationId = 1,
                                MachineName = "machine02",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            },
                            new HealthCheckViewModel
                            {
                                Name = "Other service",
                                ApplicationId = 1,
                                MachineName = "machine02",
                                CheckTime = now,
                                Success = Random.NextDouble() > 0.2,
                            }
                        };

                        foreach (var healthCheck in healthchecks)
                        {
                            applicationHealtcheks.Add(healthCheck);
                        }
                    }

                    Thread.Sleep(500);
                }
            }).Start();
        }

        [HttpGet("get-latest/{applicationId:int}")]
        public List<HealthCheckViewModel> GetLatestData(int applicationId)
        {
#if DEBUG
            var now = DateTime.Now;

            var healthchecks = new List<HealthCheckViewModel>
            {
                new HealthCheckViewModel
                {
                    Name = "Database",
                    ApplicationId = applicationId,
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Queue",
                    ApplicationId = applicationId,
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Other service",
                    ApplicationId = applicationId,
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                }
            };

            while (healthchecks.Count < 1800)
            {
                now = now.AddSeconds(1);
                healthchecks.AddRange(new[]
                {
                    new HealthCheckViewModel
                    {
                        Name = "Database",
                        ApplicationId = applicationId,
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Queue",
                        ApplicationId = applicationId,
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Other service",
                        ApplicationId = applicationId,
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    }
                });
            }

            return healthchecks;
#endif

            _healthChecksByApplicationId.TryGetValue(applicationId, out var healthChecks);
            return new List<HealthCheckViewModel>(healthChecks) ?? new List<HealthCheckViewModel>();
        }
    }

    public class HealthCheckViewModel
    {
        public int ApplicationId { get; set; }
        public string MachineName { get; set; }
        public string Name { get; set; }
        public DateTime CheckTime { get; set; }
        public bool Success { get; set; }
    }

    public class ApplicationDefinitionViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
